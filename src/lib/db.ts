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
    connectionLimit: 20, // Increased from 5 to handle more concurrent connections
    queueLimit: 10, // Increased from 3 to handle more queued requests
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000, // Close idle connections after 60 seconds
    maxIdle: 10, // Maximum number of idle connections to keep
});

// Simple query function that ensures connections are always released
export async function query(sql: string, params: any[] = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error: any) {
        console.error("Database query error:", error);
        // If it's a connection error, try to reconnect
        if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Connection error detected, attempting to reconnect...');
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                connection = await pool.getConnection();
                const [results] = await connection.execute(sql, params);
                return results;
            } catch (retryError) {
                console.error("Retry failed:", retryError);
                throw retryError;
            }
        }
        throw error;
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error("Error releasing connection:", releaseError);
            }
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
