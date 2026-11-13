import { useEffect, useState } from "react";

/**
 * Runs an API call when the component mounts (and when deps change) and
 * tracks its three states, so pages do not repeat this code.
 *
 *   const { data, error, isLoading } = useApi(() => getMatch(id), [id]);
 */
export default function useApi(apiCall, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If the user leaves the page before the response arrives, ignore it.
    let isCurrent = true;

    setIsLoading(true);
    setError("");

    apiCall()
      .then((result) => {
        if (isCurrent) setData(result);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, error, isLoading };
}
