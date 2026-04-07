'use client';
import { signIn } from 'next-auth/react';
import styles from '../app/Dashboard.module.css';

export default function LoginHero() {
  return (
    <div className={styles.container}>
      <div className={styles.heroCard}>
        <h1 className={styles.title}>Identity Bridge</h1>
        <p className={styles.subtitle}>Enterprise SCIM Provisioning Engine</p>
        
        <button 
          onClick={() => signIn('custom-oidc')} 
          className={styles.loginBtn}
        >
          Administrator Log In
        </button>
      </div>
    </div>
  );
}
