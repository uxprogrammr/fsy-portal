import mysql from "mysql2/promise";

const isProduction = process.env.NODE_ENV === "production";

// Create a connection pool with very conservative settings
const pool = mysql.createPool({
    host: isProduction ? process.env.MYSQL_HOST : "localhost",
    user: isProduction ? process.env.MYSQL_USER : "ivan",
    password: isProduction ? process.env.MYSQL_PASSWORD : "ivan12345",
    database: isProduction ? process.env.MYSQL_DATABASE : "fsy2025",
    port: isProduction ? Number(process.env.MYSQL_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 5, // Drastically reduced to prevent connection exhaustion
    queueLimit: 3, // Limit queue size
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Simple query function that ensures connections are always released
export async function query(sql: string, params: any[] = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Function to execute a transaction
export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection;
    try {
        connection = await pool.getConnection();
        
        await connection.beginTransaction();
        
        const result = await callback(connection);
        
        await connection.commit();
        return result;
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Export the pool for direct access if needed
export default pool;
