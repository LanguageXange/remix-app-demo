import { Form, useNavigation, useSearchParams } from "@remix-run/react";
import { classNames } from "~/utils/misc";
import { SearchIcon } from "./Icon";

type SearchBarProps = {
  placeholderText: string;
  otherClass?: string;
};
export function SearchBar({ placeholderText, otherClass }: SearchBarProps) {
  const [searchParam] = useSearchParams();
  const navigation = useNavigation();
  const isSearching = navigation.formData?.has("q");
  return (
    <Form
      className={classNames(
        "flex border-2 border-gray-400 rounded-md",
        "focus-within:border-primary",
        isSearching ? "animate-pulse" : "",
        otherClass
      )}
    >
      <button className="px-2 mr-1">
        <SearchIcon />
      </button>
      <input
        defaultValue={searchParam.get("q") ?? ""}
        type="text"
        name="q"
        autoComplete="off"
        placeholder={placeholderText}
        className="p-2 w-full outline-none rounded-md"
      />
    </Form>
  );
}
