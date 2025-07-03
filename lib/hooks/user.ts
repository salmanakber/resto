import { useState, useEffect } from "react";

export const useUser = () => {
  const [user, setUser] = useState(null); // user starts as null
  const [loading, setLoading] = useState(true); // loading starts as true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Call the API route to fetch user data
        const response = await fetch("/api/users/me");

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const fetchedUser = await response.json();
        setUser(fetchedUser); // Set the fetched user
      } catch (error: any) {
        setError(error.message); // Set the error if any
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchUser();
  }, []); // Empty dependency array ensures it only runs once on mount


  // Return user, loading, and error
  return { user, loading, error };
};
