import "./globals.css";

export const metadata = {
    title: "Warehouse management",
    description: "Warehouse management system",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
