import React, { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  BloomPlugin,
  AnisotropyPlugin,
  GammaCorrectionPlugin,
  addBasePlugins,
  TweakpaneUiPlugin,
  AssetManagerBasicPopupPlugin,
  CanvasSnipperPlugin,
  mobileAndTabletCheck,
} from "webgi"; // You should import only what you need
import { scrollAnimation } from "../lib/scroll-animation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const WebgiViewer = () => {
  const canvasRef = useRef(null);

  const memoizedScrollAnimation = useCallback((position, target, onUpdate) => {
    {
      if (position && target && onUpdate) {
        scrollAnimation(position, target, onUpdate);
      }
    }
  }, []);

  useEffect(() => {
    const setupViewer = async () => {
      // Initialize the viewer
      const viewer = new ViewerApp({
        canvas: canvasRef.current,
      });
      const manager = await viewer.addPlugin(AssetManagerPlugin);

      const camera = viewer.scene.activeCamera;
      const position = camera.position;
      const target = camera.target;

      // Add plugins individually.
      await viewer.addPlugin(GBufferPlugin);
      await viewer.addPlugin(new ProgressivePlugin(32));
      await viewer.addPlugin(new TonemapPlugin(!viewer.useRgbm));
      await viewer.addPlugin(GammaCorrectionPlugin);
      await viewer.addPlugin(SSRPlugin);
      await viewer.addPlugin(SSAOPlugin);
      await viewer.addPlugin(BloomPlugin);

      await addBasePlugins(viewer);

      // Add more plugins not available in base, like CanvasSnipperPlugin which has helpers to download an image of the canvas.
      await viewer.addPlugin(CanvasSnipperPlugin);

      // This must be called once after all plugins are added.
      viewer.renderer.refreshPipeline();

      // Import and add a GLB file.
      await manager.addFromPath("scene-black.glb");

      viewer.getPlugin(TonemapPlugin).config.clipBackground = true;

      //   Need to add this because we need custom controls from the user
      viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

      window.scrollTo(0, 0);

      let needsupdate = true;

      const onUpdate = () => {
        needsupdate = true;
        viewer.setDirty();
      }
      viewer.addEventListener("preFrame", () => {
        if (needsupdate) {
          camera.positionTargetUpdated(true);
          needsupdate = false;
        }
      });

      memoizedScrollAnimation(position, target , onUpdate)
    };

    setupViewer();
  }, []);

  return (
    <div id="webgi-canvas-container">
      <canvas id="webgi-canvas" ref={canvasRef} />
    </div>
  );
};

export default WebgiViewer;
