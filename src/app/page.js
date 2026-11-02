import styles from "./page.module.css";

export default function Home() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <div className={styles.intro}>
                    {<h1>Registration</h1>}
                    {<input className={styles.emailField} name="email" />}
                    {<input className={styles.passwordField} name="password" />}
                    {<p className={styles.footerText}>Temporary text</p>}
                </div>
            </main>
        </div>
    );
}
