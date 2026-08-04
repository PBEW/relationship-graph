import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPerson, deletePerson, updatePerson, uploadAvatar } from "@/api/people";
import type { PersonInput } from "@/types";

function useInvalidatePeople() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["people"] });
    queryClient.invalidateQueries({ queryKey: ["person-profile"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["graph"] });
  };
}

export function useCreatePerson() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (input: PersonInput) => createPerson(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePerson() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PersonInput> }) =>
      updatePerson(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePerson() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: invalidate,
  });
}

export function useUploadAvatar() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadAvatar(id, file),
    onSuccess: invalidate,
  });
}
