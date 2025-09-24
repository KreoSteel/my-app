import pool from "@/lib/supabase";
import bcrypt from 'bcrypt'

async function registerUser(fullName: string, email: string, password: string) {
    try {
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            "INSERT INTO users (full_name, email, hashed_password) VALUES ($1, $2, $3) RETURNING id, full_name AS \"fullName\", email",
            [fullName, email, hash]
        )
        return result.rows[0]
    } catch (error) {
        console.error("registerUser service error:", error);
        return { error: "Failed to register user" };
    }
}

async function loginUser(email: string, password: string) {
    try {
        const result = await pool.query(
            'SELECT id, full_name AS "fullName", email, hashed_password FROM users WHERE email = $1',
            [email]
        )
        if (result.rowCount === 0) {
            return { error: 'Invalid credentials' }
        }
        const user = result.rows[0]
        const isMatch = await bcrypt.compare(password, user.hashed_password)
        if (!isMatch) {
            return { error: 'Invalid credentials' }
        }
        const { id, fullName, email: userEmail } = user
        return { id, fullName, email: userEmail }
    } catch (error) {
        console.error("loginUser service error:", error);
        return { error: "Failed to login user" };
    }
}

export default { registerUser, loginUser }