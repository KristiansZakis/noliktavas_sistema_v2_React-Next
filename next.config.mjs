const nextConfig = {
    serverExternalPackages: ["better-sqlite3"],
    async redirects() {
        return [
            {
                source: "/",
                destination: "/register",
                permanent: false,
            },
        ];
    },
};
export default nextConfig;
