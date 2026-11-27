import TagsField from '../../components/ui/TagsField.jsx';
import { useAddInterest, useInterestTags, useRemoveInterest } from './hooks.js';

// What this member likes (golf, F1, wine ...). Only Admins and the relationship manager see this.
// When an event or post is tagged with the same word, the relationship manager gets a tip.
export default function MemberInterests({ id, interests }) {
  const add = useAddInterest(id);
  const remove = useRemoveInterest(id);
  const { data: suggestions = [] } = useInterestTags();
  const busy = add.isPending || remove.isPending;

  return (
    <div className={busy ? 'pointer-events-none opacity-70' : ''}>
      <TagsField
        label="Likes"
        value={interests.map((i) => i.tag)}
        suggestions={suggestions}
        onChange={(next) => {
          const current = interests.map((i) => i.tag);
          const added = next.find((t) => !current.includes(t));
          if (added) return add.mutate(added);
          const gone = interests.find((i) => !next.includes(i.tag));
          if (gone) remove.mutate(gone.id);
        }}
        hint="Press Enter after each one. Members never see this. You get a tip when an event or post is tagged with the same word."
      />
    </div>
  );
}
