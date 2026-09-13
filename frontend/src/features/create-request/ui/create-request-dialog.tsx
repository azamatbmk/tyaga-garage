import { type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";

export function CreateRequestDialog({
  open,
  categories,
  category,
  priority,
  onCategory,
  onPriority,
  onClose,
  onSubmit,
}: {
  open: boolean;
  categories: string[];
  category: string;
  priority: string;
  onCategory: (value: string) => void;
  onPriority: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.dialog} role="dialog" aria-labelledby="create-title">
        <div className={styles.kicker}>
          <span className={styles.dialogIcon}>
            <Plus size={23} />
          </span>
          <button className={ui.iconButton} aria-label="Закрыть новую заявку" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2 id="create-title">Новая заявка</h2>
        <p className={styles.description}>12 сентября · дневная смена 08:00–20:00</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={ui.formField}>
            Какие работы нужно выполнить?
            <input required maxLength={80} name="title" placeholder="Например, разработка котлована" />
          </label>
          <label className={ui.formField}>
            Объект и адрес
            <input required maxLength={120} name="location" placeholder="Название объекта, улица или участок" />
          </label>
          <SelectField
            label="Тип техники"
            value={category}
            onChange={onCategory}
            options={categories.map((item) => ({ value: item, label: item }))}
          />
          <div className={styles.formRow}>
            <label className={ui.formField}>
              Начало
              <input type="time" name="start" defaultValue="13:00" min="08:00" max="19:45" step={900} required />
            </label>
            <label className={ui.formField}>
              Окончание
              <input type="time" name="end" defaultValue="17:00" min="08:15" max="20:00" step={900} required />
            </label>
          </div>
          <SelectField
            label="Приоритет"
            value={priority}
            onChange={onPriority}
            options={[
              { value: "normal", label: "Обычный" },
              { value: "urgent", label: "Приоритетная заявка" },
            ]}
          />
          <button className={`${ui.primaryButton} ${ui.wide}`} type="submit">
            <Plus size={18} />
            Создать заявку
          </button>
        </form>
      </div>
    </Modal>
  );
}
