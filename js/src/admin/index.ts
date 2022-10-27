import app from 'flarum/admin/app';

app.initializers.add('clarkwinkelmann-vote-with-money', () => {
    app.extensionData
        .for('clarkwinkelmann-vote-with-money')
        .registerSetting({
            type: 'text',
            setting: 'vote-with-money.preselection',
            label: app.translator.trans('clarkwinkelmann-vote-with-money.admin.settings.preselection'),
        })
        .registerSetting({
            type: 'number',
            setting: 'vote-with-money.min',
            label: app.translator.trans('clarkwinkelmann-vote-with-money.admin.settings.min'),
            min: 0,
        })
        .registerSetting({
            type: 'number',
            setting: 'vote-with-money.max',
            label: app.translator.trans('clarkwinkelmann-vote-with-money.admin.settings.max'),
            min: 0,
        });
});
