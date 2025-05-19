import { {{hooks.find}} } from '{{endpointImport}}';
import {{entity}}Form from '../../components/{{kebab}}-form';

export default async function Edit{{entity}}({ params }: { params: { id: string } }) {
  const { data } = await {{hooks.find}}({ id: +params.id });
  return <{{entity}}Form defaultValues={data} />;
}
