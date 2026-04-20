/**
 * Get user session from Express auth server
 * @param request - Astro request object  
 * @returns Session data with user information
 */
export async function getSession(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    
    const response = await fetch('http://localhost:9000/api/auth/get-session', {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}