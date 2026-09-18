import Modal from '@/components/Modal';
import SettingsChoiceList, { type SettingsChoiceItem } from './SettingsChoiceList';

interface SettingsChoiceModalProps {
    title: string;
    items: SettingsChoiceItem[];
    value: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

export default function SettingsChoiceModal({ title, items, value, onSelect, onClose }: SettingsChoiceModalProps) {
    return (
        <Modal title={title} onClose={onClose}>
            <SettingsChoiceList
                items={items}
                value={value}
                onSelect={(next) => {
                    onSelect(next);
                    onClose();
                }}
            />
        </Modal>
    );
}
