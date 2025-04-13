import mysql from "mysql2/promise";

const isProduction = process.env.NODE_ENV === "production";

const pool = mysql.createPool({
    host: isProduction ? process.env.MYSQL_HOST : "localhost",
    user: isProduction ? process.env.MYSQL_USER : "ivan",
    password: isProduction ? process.env.MYSQL_PASSWORD : "ivan12345",
    database: isProduction ? process.env.MYSQL_DATABASE : "fsy2025",
    port: isProduction ? Number(process.env.MYSQL_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export async function query(sql: string, params: any[] = []) {
    try {
        const [results] = await pool.execute(sql, params);

        // Check if results are an array (SELECT queries)
        if (Array.isArray(results)) {
            return results;
        }

        // For INSERT, UPDATE, or DELETE, return the result object directly
        if (typeof results === "object") {
            return results;
        }

        throw new Error("Unexpected query result format");
    } catch (error) {
        console.error("Database query error:", error);
        return [];
    }
}

export default pool;
