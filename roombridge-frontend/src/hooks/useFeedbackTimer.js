import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const SESSION_KEY = "rb_feedback_shown";
const DELAY_MS    = 3 * 60 * 1000; // 3 minutes

/**
 * useFeedbackTimer
 *
 * Starts a 3-minute countdown once the user is authenticated.
 * Returns { showModal, dismiss } so the host component can
 * control the <FeedbackModal />.
 *
 * The flag is stored in sessionStorage so the popup only ever
 * appears once per browser session — never again after dismissed
 * or submitted.
 */
const useFeedbackTimer = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => {
    // Only trigger if authenticated AND not already shown this session
    if (!isAuthenticated || sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      // Double-check it wasn't set during the wait (e.g. user submitted in another tab)
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setShowModal(true);
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const dismiss = () => {
    setShowModal(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  return { showModal, dismiss };
};

export default useFeedbackTimer;
