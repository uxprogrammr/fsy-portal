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
    connectionLimit: 10, // Reduced from 20 to prevent connection exhaustion
    queueLimit: 5, // Reduced from 10 to prevent queue buildup
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 30000, // Reduced from 60000 to close idle connections faster
    maxIdle: 5, // Reduced from 10 to maintain fewer idle connections
});

// Simple query function that ensures connections are always released
export async function query(sql: string, params: any[] = []) {
    let connection;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
        try {
            connection = await pool.getConnection();
            const [results] = await connection.execute(sql, params);
            return results;
        } catch (error: any) {
            console.error("Database query error:", error);
            
            if (connection) {
                try {
                    connection.release();
                } catch (releaseError) {
                    console.error("Error releasing connection:", releaseError);
                }
            }
            
            // If it's a connection error and we haven't exceeded max retries
            if ((error.code === 'ER_CON_COUNT_ERROR' || error.code === 'PROTOCOL_CONNECTION_LOST') 
                && retryCount < maxRetries) {
                console.log(`Connection error detected, retry attempt ${retryCount + 1}/${maxRetries}...`);
                retryCount++;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                continue;
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
