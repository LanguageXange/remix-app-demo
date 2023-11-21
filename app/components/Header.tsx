type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return <h1 className="text-lg font-medium">{title}</h1>;
}
