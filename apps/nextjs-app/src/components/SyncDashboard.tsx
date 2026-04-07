'use client';
import { useState, useEffect } from 'react';
import { getSyncStatus, triggerManualSync } from '../app/actions';
import { signOut } from 'next-auth/react';
import styles from '../app/Dashboard.module.css';

export default function SyncDashboard({ session }: { session: any }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string>('System initializing...');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const res = await getSyncStatus();
    setStatus(res);
  };

  const handleSync = async () => {
    setLoading(true);
    setLogs('Initiating manual synchronization. Contacting Agent Service...\n');
    
    const res = await triggerManualSync();
    
    if (res.error) {
      setLogs(prev => prev + `\nFATAL ERROR: ${res.error}`);
    } else {
      setLogs(prev => prev + `\nSync Sequence Completed.`);
      setLogs(prev => prev + `\nSuccessfully Pushed: ${res.successCount}`);
      setLogs(prev => prev + `\nFailed Interactions: ${res.failureCount}`);
      
      if (res.errors && res.errors.length > 0) {
        setLogs(prev => prev + `\n\nERROR LOGS:\n` + JSON.stringify(res.errors, null, 2));
      }
    }
    
    await fetchStatus();
    setLoading(false);
  };

  return (
    <div className={styles.dashWrapper}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Identity Bridge Node</h1>
          <div className={styles.welcomeUser}>Active Session: {session?.user?.email || 'Administrator'}</div>
        </div>
        <button onClick={() => signOut()} className={styles.logoutBtn}>Terminate Session</button>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span className={`${styles.statusIndicator} ${status?.error ? styles.error : ''}`}></span>
            Daemon Health
          </div>
          <div className={styles.statValue}>
            {status?.error ? 'OFFLINE' : (status?.status?.toUpperCase() || 'CONNECTING...')}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Target Protocol</div>
          <div className={styles.statValue}>{status?.engine || 'SCIM 2.0'}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Last Active Ping</div>
          <div className={styles.statValue} style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
            {status?.lastSyncTime || 'Fetching State...'}
          </div>
        </div>
      </div>

      <div className={styles.actionArea}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Manual Override</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Force the daemon to query AD and map deltas instantly bypassing the Cron delay.</p>
        
        <button className={styles.syncBtn} onClick={handleSync} disabled={loading}>
          {loading ? <span className={styles.spinner}></span> : 'Force Synchronization'}
        </button>
      </div>
      
      <div className={styles.logArea}>
        {logs}
      </div>
    </div>
  );
}
