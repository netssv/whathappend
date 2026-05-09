global.chrome = {
    sidePanel: { setPanelBehavior: () => {} },
    commands: { onCommand: { addListener: () => {} } },
    tabs: { onActivated: { addListener: () => {} }, onUpdated: { addListener: () => {} }, onRemoved: { addListener: () => {} } },
    runtime: { onMessage: { addListener: () => {} } },
    alarms: { onAlarm: { addListener: () => {} } }
};
