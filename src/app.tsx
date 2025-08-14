import { type FC, useState } from "react";
import { StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

import { ImageViewer } from "@/componets/image-viewer";
import { Button } from "@/componets/button";

const PlaceholderImage: ImageSourcePropType = require("@/assets/images/background-image.png");

const App: FC = () => {
  const [selectedImage, setSelectedImage] = useState<null | string>(null);

  const pickImageAsync = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result);
      setSelectedImage(result.assets[0].uri);
    } else {
      alert("画像が選択されていません");
    }
  };

  return (
    <View style={styles.container}>
       {/* <Text style={{ color: "#fff" }}>Hello, World!</Text> */}
      <Text style={ styles.text }>Open up app.tsx to start working on your app!</Text>
      <View style={styles.imageContainer}>
        <ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} /> 
      </View>
      <View style={styles.footerContainer}>
        <Button label="写真を選択" theme="primary" onPress={pickImageAsync} />
        <Button label="この写真を使用" />
      </View>
    <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
  },
  imageContainer: {
    flex: 1,
    padding: 58,
  },
  footerContainer: {
    flex: 1/3,
    alignItems: "center",
  }
});

registerRootComponent(App);
