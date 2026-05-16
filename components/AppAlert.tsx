import React from "react";
import AwesomeAlert from "react-native-awesome-alerts";

type Props = {
  show: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning";
  onConfirm: () => void;
};

export default function AppAlert({
  show,
  title,
  message,
  type = "success",
  onConfirm,
}: Props) {
  return (
    <AwesomeAlert
      show={show}
      showProgress={false}
      title={title}
      message={message}
      closeOnTouchOutside={true}
      closeOnHardwareBackPress={false}
      showConfirmButton={true}
      confirmText="OK"
      confirmButtonColor={
        type === "success"
          ? "#22c55e"
          : type === "error"
          ? "#ef4444"
          : "#f59e0b"
      }
      onConfirmPressed={onConfirm}
    />
  );
}