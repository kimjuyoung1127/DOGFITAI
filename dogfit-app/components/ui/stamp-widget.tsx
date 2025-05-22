"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PawPrint } from "lucide-react"
import { supabase } from '../../lib/supabase/supabaseClient' // Corrected path
import { getLocalStorageItem } from "@/lib/utils"

export function StampWidget() {
  const [stamps, setStamps] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const profile_id = getLocalStorageItem<string | null>("dogfit-selected-profile-id", null);

      if (!profile_id) {
        console.log("StampWidget: No profile_id found.");
        setError("사용자 정보를 찾을 수 없습니다."); // User-friendly error
        setLoading(false);
        setStamps(0);
        setBadges([]);
        return;
      }

      try {
        // Fetch Latest total_stamp_count
        const { data: latestStamp, error: stampError } = await supabase
          .from('stamps')
          .select('total_stamp_count')
          .eq('profile_id', profile_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (stampError && stampError.code !== 'PGRST116') { 
          console.error('Error fetching stamps:', stampError);
          throw new Error("스탬프 개수 조회 실패"); // Throw to be caught by general catch
        }
        setStamps(latestStamp?.total_stamp_count || 0);

        // Fetch Awarded Badges
        const { data: badgeRecords, error: badgesError } = await supabase
          .from('stamps')
          .select('badge_type, achieved_at')
          .eq('profile_id', profile_id)
          .not('badge_type', 'is', null)
          .order('achieved_at', { ascending: false });

        if (badgesError) {
          console.error('Error fetching badges:', badgesError);
          throw new Error("뱃지 정보 조회 실패"); // Throw to be caught by general catch
        }
        
        if (badgeRecords) {
          const uniqueBadgeTypes = Array.from(new Set(badgeRecords.map(b => b.badge_type).filter(Boolean) as string[]));
          setBadges(uniqueBadgeTypes);
        } else {
          setBadges([]);
        }
        setError(null); // Clear error if both succeed

      } catch (e) {
        console.error("Error fetching stamp/badge info:", e);
        setError("스탬프 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
        setStamps(0); 
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Optional: Add a listener for custom event if stamps can be updated elsewhere
    // and you want the widget to refresh. For example:
    // window.addEventListener('stampsUpdated', fetchData);
    // return () => window.removeEventListener('stampsUpdated', fetchData);

  }, []); // Runs on component mount

  const hasAnyBadge = badges.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 bg-white rounded-full p-2 shadow-lg flex items-center gap-2 cursor-pointer">
            <PawPrint className="h-5 w-5 text-primary" />
            {loading ? (
              <span className="font-bold text-sm animate-pulse">...</span>
            ) : (
              <span className="font-bold text-sm">{stamps}</span>
            )}
            {!loading && !error && hasAnyBadge && <Badge className="bg-primary text-white text-xs">뱃지 획득!</Badge>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {loading ? (
            <p>스탬프 정보를 불러오는 중...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <>
              <p>현재 {stamps}개의 스탬프를 모았어요! {badges.length > 0 ? `획득한 뱃지: ${badges.join(", ")}` : ""}</p>
              {badges.length === 0 && !error && <p>5개 모으면 첫 뱃지를 획득할 수 있어요.</p>}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
