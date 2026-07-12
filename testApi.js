const apiURL = 'https://medresa.onrender.com/api';

async function testApi() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch(`${apiURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'fuadf5277@gmail.com', password: 'password123' }) // The user's email from git commit
        });
        const loginData = await loginRes.json();
        if (!loginData.token) {
            console.log("Login failed");
            return;
        }

        console.log("Testing API performance...");
        const start = Date.now();
        const res2 = await fetch(`${apiURL}/admin/students`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const end = Date.now();
        
        console.log(`Students route status: ${res2.status}, Time: ${end - start}ms`);
        const data = await res2.json();
        console.log("Students count:", data.length);
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testApi();
