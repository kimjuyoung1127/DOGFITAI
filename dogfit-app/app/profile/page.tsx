"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import type { DogProfile } from "@/lib/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<DogProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = checkUserAuthentication();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch profiles from Supabase
    fetchProfiles();
  }, [])

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // Log for debugging
      console.log("Fetching profiles from Supabase...");
      
      const { data, error } = await supabase
        .from('dog_profile')
        .select('*');
      
      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("프로필 불러오기 실패:", error);
        toast({
          title: "프로필 불러오기 실패",
          description: "프로필을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setProfiles(data || []);
      }
    } catch (e) {
      console.error("프로필 불러오기 중 오류 발생:", e);
      toast({
        title: "오류 발생",
        description: "프로필을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    try {
      const { error } = await supabase
        .from('dog_profile')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error("프로필 삭제 실패:", error);
        toast({
          title: "프로필 삭제 실패",
          description: "프로필을 삭제하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        // Update local state after successful deletion
        setProfiles(profiles.filter(profile => profile.id !== profileId));
        toast({
          title: "프로필 삭제 완료",
          description: "프로필이 성공적으로 삭제되었습니다.",
        });
      }
    } catch (e) {
      console.error("프로필 삭제 중 오류 발생:", e);
      toast({
        title: "오류 발생",
        description: "프로필을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleEditProfile = (profileId: number) => {
    router.push(`/form?profileId=${profileId}`);
  };

  const handleAddProfile = () => {
    router.push('/form');
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">나의 반려견 프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p>프로필을 불러오는 중...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center">
              <p className="text-lg">등록된 반려견이 없어요!</p>
              <Button onClick={handleAddProfile} className="mt-4">새 프로필 등록</Button>
            </div>
          ) : (
            profiles.map(profile => (
              <Card key={profile.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{profile.name}</span>
                    <Badge>{profile.breed}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>나이: {Math.round(profile.age / 12)}세</p>
                  <p>체중: {profile.weight}kg</p>
                  <p>성별: {profile.sex}</p>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => handleEditProfile(profile.id)}>수정</Button>
                    <Button variant="destructive" onClick={() => { setSelectedProfile(profile); setIsDialogOpen(true); }}>삭제</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedProfile && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로필 삭제</DialogTitle>
            </DialogHeader>
            <p>정말 {selectedProfile.name}의 프로필을 삭제하시겠어요?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
              <Button variant="destructive" onClick={() => handleDeleteProfile(selectedProfile.id)}>삭제</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Example function to check user authentication
function checkUserAuthentication() {
  // Implement your authentication check logic here
  return true; // or false based on authentication status
}
