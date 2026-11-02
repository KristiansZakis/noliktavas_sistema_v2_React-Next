import styles from "./page.module.css";

export default function Home() {
    return (
        <div className={styles.page}>
            <header className={styles.mainHeader}>
                <h1>Temporary text</h1>
            </header>

            <main className={styles.main}>
                <div className={styles.intro}>{}</div>
            </main>
        </div>
    );
}
