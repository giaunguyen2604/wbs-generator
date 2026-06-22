import { create } from "zustand";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
};

// Tiny promise-based confirm store so any action can `await confirm({...})`.
const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => set({ open: true, options, resolve })),
  close: (ok) => {
    get().resolve?.(ok);
    set({ open: false, options: null, resolve: null });
  },
}));

export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().ask(options);

// Mount once near the app root.
export function ConfirmDialogHost() {
  const { open, options, close } = useConfirmStore();
  if (!options) return null;
  return (
    <ModalDialog
      open={open}
      title={options.title}
      onClose={() => close(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={options.danger ? "danger" : "primary"}
            onClick={() => close(true)}
          >
            {options.confirmLabel ?? "Confirm"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{options.message}</p>
    </ModalDialog>
  );
}
