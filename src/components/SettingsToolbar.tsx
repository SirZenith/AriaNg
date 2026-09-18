import RpcSelector from './RpcSelector';

export default function SettingsToolbar() {
    return (
        <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
            <RpcSelector />
        </div>
    );
}
