"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/assets/loading.json";

interface LottieLoadingProps {
  className?: string;
}

const LottieLoading = ({ className = "" }: LottieLoadingProps) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: 200, height: 200 }}
      />
      <h5 className="text-white text-2xl font-bold text-center">
        We are preparing questions,
        <br />
        please wait a moment.
      </h5>
    </div>
  );
};

export default LottieLoading;
