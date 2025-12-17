import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot ,limit} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export const useCyclePredictor = () => {
  const { user } = useAuth();
  const [currentCycle, setCurrentCycle] = useState(null);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'cycles', user.uid, 'userCycles'),
      orderBy('startDate', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cycles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (cycles.length > 0) {
        setCurrentCycle(cycles[0]);
        calculatePredictions(cycles);
      }
    });

    return unsubscribe;
  }, [user]);

  const calculatePredictions = (cycles) => {
    if (cycles.length < 3) return;

    const avgCycleLength = cycles.reduce((sum, cycle) => 
      sum + cycle.cycleLength, 0) / cycles.length;

    const lastCycle = cycles[0];
    const nextPeriodDate = new Date(lastCycle.startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);

    const ovulationDate = new Date(nextPeriodDate);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);

    setPredictions({
      nextPeriod: nextPeriodDate,
      ovulation: ovulationDate,
      fertileWindow: {
        start: fertileStart,
        end: ovulationDate
      }
    });
  };

  return { currentCycle, predictions };
};