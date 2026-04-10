import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // 확장 프로그램의 각 입구(Entry Point) 설정
        popup: resolve(__dirname, "src/popup/popup.html"),
        background: resolve(__dirname, "src/background/main.js"),
        content: resolve(__dirname, "src/content/injector.js"),
      },
      output: {
        // 빌드된 파일이 assets 폴더 안에 일관된 이름으로 생성되도록 설정
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
