import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export const useSync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const syncLocalData = async (localData) => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // Sync cycles
      for (const cycle of localData.cycles || []) {
        await setDoc(doc(db, 'cycles', user.uid, 'userCycles', cycle.id), cycle);
      }
      
      // Sync logs
      for (const log of localData.logs || []) {
        await setDoc(doc(db, 'dailyLogs', user.uid, 'logs', log.date), log);
      }
      
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadCloudData = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const [cyclesSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'cycles', user.uid, 'userCycles')),
        getDocs(collection(db, 'dailyLogs', user.uid, 'logs'))
      ]);

      const cycles = cyclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return { cycles, logs };
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncLocalData, downloadCloudData, isSyncing, lastSync };
};