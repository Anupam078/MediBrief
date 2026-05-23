// Connects to the Spring Boot orchestration layer
const API_BASE_URL = 'http://localhost:8080/api/patient';

export const evaluateRecord = async (text) => {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Ignore JSON parse error if body is empty or not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
