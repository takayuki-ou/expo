import React, { type FC } from "react";
import { StyleSheet, View, Pressable, Text, type GestureResponderEvent } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type ButtonProps = {
  label: string;
  theme?: "primary" | undefined;
  onPress?: null | ((event: GestureResponderEvent) => void) | undefined;
  disabled?: boolean;
};

export const Button: FC<ButtonProps> = (props) => {
  const { disabled = false } = props;

  if (props.theme === "primary") {
    return (
      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: "#007AFF" },
            disabled && styles.buttonDisabled
          ]}
          onPress={props.onPress}
          disabled={disabled}
        >
          <FontAwesome name="camera" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={[styles.buttonLabel, disabled && styles.buttonLabelDisabled]}>
            {props.label}
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={props.onPress}
        disabled={disabled}
      >
        <Text style={[styles.buttonLabel, disabled && styles.buttonLabelDisabled]}>
          {props.label}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
  },
  buttonLabelDisabled: {
    opacity: 0.7,
  },
});
