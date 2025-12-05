"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";

 const ATTENDEE_PAGE = ["/explore", "/events", "/my-tickets"];

export function useOnboarding() {
    const [showOnboarding,setShowOnboarding] = useState(false);
        const pathname=usePathname();
        const router=useRouter();

    const {data: currentUser, isLoading  }=useConvexQuery(
        api.users.getCurrentUser
    );

    useEffect(()=>{
        if(isLoading || !currentUser) return

        if(!currentUser.hasCompletedOnboarding) {
            //check if current  page require onboarding
            const requiresOnboarding=ATTENDEE_PAGE.some((page)=>
                pathname.startsWith(page)
            );

            if(requiresOnboarding) {
                // eslint-disable-next-line react-hook/set-state-in-effect
                setShowOnboarding(true);
            }
                
        }
    },[currentUser, pathname,isLoading]);

    const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh to get updated user data
    router.refresh();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Redirect back to homepage if they skip
    router.push("/");
  };

  return {
    showOnboarding,
    setShowOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    needsOnboarding: currentUser && !currentUser.hasCompletedOnboarding,
  }
}