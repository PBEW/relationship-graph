import { apiClient } from "@/api/client";
import type { Gender, Paginated, Person, PersonInput, PersonProfile } from "@/types";

export interface PeopleQuery {
  page?: number;
  per_page?: number;
  search?: string;
  gender?: Gender;
  country?: string;
}

export async function listPeople(query: PeopleQuery = {}): Promise<Paginated<Person>> {
  const { data } = await apiClient.get<Paginated<Person>>("/people", { params: query });
  return data;
}

export async function getPersonProfile(id: string): Promise<PersonProfile> {
  const { data } = await apiClient.get<PersonProfile>(`/people/${id}`);
  return data;
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const { data } = await apiClient.post<Person>("/people", input);
  return data;
}

export async function updatePerson(id: string, input: Partial<PersonInput>): Promise<Person> {
  const { data } = await apiClient.put<Person>(`/people/${id}`, input);
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  await apiClient.delete(`/people/${id}`);
}

export async function uploadAvatar(id: string, file: File): Promise<Person> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<Person>(`/people/${id}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
