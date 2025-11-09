"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/assets/loading.json";

interface LottieLoadingProps {
  className?: string;
}

const LottieLoading = ({ className = "" }: LottieLoadingProps) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-[200px] md:h-[200px]">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <h5 className="text-white md:text-2xl text-sm font-bold text-center mt-2 sm:mt-4">
        We are preparing questions,
        <br />
        please wait a moment.
      </h5>
    </div>
  );
};

export default LottieLoading;
