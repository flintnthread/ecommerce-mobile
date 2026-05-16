import { useState } from "react";

export default function useAppAlert() {

  const [visible, setVisible] = useState(false);

  const [title, setTitle] = useState("");

  const [message, setMessage] = useState("");

  const [type, setType] = useState<
    "success" | "error" | "warning"
  >("success");

  const showAlert = (
    titleText: string,
    messageText: string,
    alertType: "success" | "error" | "warning" = "success"
  ) => {

    setTitle(titleText);

    setMessage(messageText);

    setType(alertType);

    setVisible(true);
  };

  return {
    visible,
    title,
    message,
    type,
    setVisible,
    showAlert,
  };
}