import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
// Imports End

const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  // Mutation to update User Profile
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } =
    useMutation({
      mutationFn: async (formData, coverImg, profileImg) => {
        try {
          const res = await fetch(`/api/users/update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData, coverImg, profileImg),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Something went wrong");
          }

          return data;
        } catch (error) {
          throw new Error(error);
        }
      },
      onSuccess: () => {
        toast.success("Profile updated successfully");
        // invalidate the query to refetch the data
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["authUser"] }),
          queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
        ]);
      },

      onError: (error) => {
        toast.error(error.message);
      },
    });

  return { updateProfile, isUpdatingProfile };
};

export default useUpdateUserProfile;
