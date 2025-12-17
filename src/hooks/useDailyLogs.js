import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export const useDailyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState({});
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Load all logs for the user
  useEffect(() => {
    if (!user) {
      setLogs({});
      setTodayLog(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const logsRef = collection(db, 'dailyLogs', user.uid, 'logs');
    const q = query(logsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const logsData = {};
        snapshot.forEach((doc) => {
          logsData[doc.id] = {
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps to Date objects
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          };
        });
        setLogs(logsData);
        
        // Set today's log
        const today = getTodayDateString();
        setTodayLog(logsData[today] || null);
        
        setLoading(false);
      },
      (error) => {
        console.error('Error loading logs:', error);
        setError('Failed to load logs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Get log for a specific date
  const getLog = async (date) => {
    if (!user) return null;

    try {
      const logRef = doc(db, 'dailyLogs', user.uid, 'logs', date);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        return {
          id: logSnap.id,
          ...logSnap.data(),
          createdAt: logSnap.data().createdAt?.toDate(),
          updatedAt: logSnap.data().updatedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting log:', error);
      throw error;
    }
  };

  // Create or update a log
  const saveLog = async (date, logData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const logRef = doc(db, 'dailyLogs', user.uid, 'logs', date);
      const logSnap = await getDoc(logRef);
      
      const now = Timestamp.now();
      const logToSave = {
        ...logData,
        date,
        updatedAt: now
      };

      if (logSnap.exists()) {
        // Update existing log
        await updateDoc(logRef, logToSave);
      } else {
        // Create new log
        await setDoc(logRef, {
          ...logToSave,
          createdAt: now,
          userId: user.uid
        });
      }

      // Update local state
      const newLog = {
        id: date,
        ...logToSave,
        createdAt: logSnap.exists ? logSnap.data().createdAt?.toDate() : now.toDate(),
        updatedAt: now.toDate()
      };

      setLogs(prev => ({
        ...prev,
        [date]: newLog
      }));

      if (date === getTodayDateString()) {
        setTodayLog(newLog);
      }

      return newLog;
    } catch (error) {
      console.error('Error saving log:', error);
      throw error;
    }
  };

  // Delete a log
  const deleteLog = async (date) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const logRef = doc(db, 'dailyLogs', user.uid, 'logs', date);
      await deleteDoc(logRef);

      // Update local state
      setLogs(prev => {
        const newLogs = { ...prev };
        delete newLogs[date];
        return newLogs;
      });

      if (date === getTodayDateString()) {
        setTodayLog(null);
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      throw error;
    }
  };

  // Quick update for today's log
  const updateTodayLog = async (updates) => {
    const today = getTodayDateString();
    return saveLog(today, updates);
  };

  // Get logs for a date range
  const getLogsInRange = async (startDate, endDate) => {
    if (!user) return [];

    try {
      // Note: Firestore doesn't support multiple range filters easily
      // We'll filter client-side for simplicity
      const allLogs = Object.values(logs);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return allLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      });
    } catch (error) {
      console.error('Error getting logs in range:', error);
      throw error;
    }
  };

  // Get logs with specific symptoms
  const getLogsWithSymptom = (symptomId) => {
    return Object.values(logs).filter(log => 
      log.symptoms && log.symptoms.includes(symptomId)
    );
  };

  // Get recent logs (last N days)
  const getRecentLogs = (days = 7) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    return Object.values(logs).filter(log => {
      const logDate = new Date(log.date);
      return logDate >= pastDate && logDate <= today;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get monthly summary
  const getMonthlySummary = (year, month) => {
    const logsArray = Object.values(logs);
    const monthLogs = logsArray.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });

    const summary = {
      totalDays: monthLogs.length,
      symptomDays: monthLogs.filter(log => log.symptoms && log.symptoms.length > 0).length,
      periodDays: monthLogs.filter(log => log.flow && log.flow !== 'none').length,
      moodDistribution: {},
      commonSymptoms: {}
    };

    // Calculate mood distribution
    monthLogs.forEach(log => {
      if (log.mood) {
        summary.moodDistribution[log.mood] = (summary.moodDistribution[log.mood] || 0) + 1;
      }
    });

    // Calculate common symptoms
    monthLogs.forEach(log => {
      if (log.symptoms) {
        log.symptoms.forEach(symptom => {
          summary.commonSymptoms[symptom] = (summary.commonSymptoms[symptom] || 0) + 1;
        });
      }
    });

    return summary;
  };

  // Import logs from external source
  const importLogs = async (logsData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const importPromises = logsData.map(async (logData) => {
        const logRef = doc(db, 'dailyLogs', user.uid, 'logs', logData.date);
        const now = Timestamp.now();
        
        await setDoc(logRef, {
          ...logData,
          userId: user.uid,
          createdAt: now,
          updatedAt: now,
          imported: true
        }, { merge: true });
      });

      await Promise.all(importPromises);
      return { success: true, count: logsData.length };
    } catch (error) {
      console.error('Error importing logs:', error);
      throw error;
    }
  };

  // Export logs
  const exportLogs = (format = 'json') => {
    const logsArray = Object.values(logs);
    
    if (format === 'csv') {
      return convertLogsToCSV(logsArray);
    }
    
    return {
      exportDate: new Date().toISOString(),
      totalLogs: logsArray.length,
      logs: logsArray.map(log => ({
        date: log.date,
        flow: log.flow,
        symptoms: log.symptoms,
        mood: log.mood,
        bbt: log.bbt,
        notes: log.notes,
        sexualActivity: log.sexualActivity,
        createdAt: log.createdAt?.toISOString(),
        updatedAt: log.updatedAt?.toISOString()
      }))
    };
  };

  // Helper function to convert logs to CSV
  const convertLogsToCSV = (logsArray) => {
    const headers = ['Date', 'Flow', 'Symptoms', 'Mood', 'BBT', 'Notes', 'Sexual Activity'];
    const rows = logsArray.map(log => [
      log.date,
      log.flow || '',
      log.symptoms ? log.symptoms.join(';') : '',
      log.mood || '',
      log.bbt || '',
      log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '',
      log.sexualActivity ? 'Yes' : 'No'
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  };

  return {
    logs,
    todayLog,
    loading,
    error,
    getLog,
    saveLog,
    deleteLog,
    updateTodayLog,
    getLogsInRange,
    getLogsWithSymptom,
    getRecentLogs,
    getMonthlySummary,
    importLogs,
    exportLogs,
    getTodayDateString,
    refresh: () => {
      // Force refresh by reloading logs
      if (user) {
        // The onSnapshot listener will automatically update
        // For manual refresh, we could add a timestamp trigger
      }
    }
  };
};