###
Presets view

This view display the form for the preset step
###

FormView   = require 'views/lib/form_view'
btoabuffer = require 'lib/base64-arraybuffer'



module.exports = class RegisterPresetView extends FormView

    className: 'preset'

    attributes:
        method: 'post'
        action: '/register'

    template: require 'views/templates/view_register_preset'


    serializeData: ->
        timezones: require 'lib/timezones'


    ###
    Initialize internal streams and properties
    ###
    initialize: ->
        # Creates a new property in the state machine that contains the entered
        # email value to be used in later screens.
        email = @$el.asEventStream 'blur', '#preset-email'
            .map '.target.value'
            .toProperty ''
        @model.add 'email', email

        # Create errors properties that will be used in the initError() method
        @errors =
            email:    @model.errors.map '.email'
            password: @model.errors.map '.password'
            timezone: @model.errors.map '.timezone'


    handleSubmit: ->
        @form
        .filter @onStep
        .flatMap (form) ->
            if form.autkeys
                keys = window.crypto.subtle.generateKey
                    name:           "RSA-OAEP"
                    modulusLength:  2048
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01])
                    hash:           name: "SHA-256"
                , true
                , ['encrypt', 'decrypt']

                .then (keypair) ->
                    window.crypto.subtle.exportKey 'jwk', keypair.privateKey
                    .then (keydata) ->
                        localStorage['privateKey'] = JSON.stringify keydata

                    window.crypto.subtle.exportKey 'jwk', keypair.publicKey
                    .then (keydata) ->
                        form.pubkey = JSON.stringify keydata

                    return keypair

                .then (keypair) ->
                    window.crypto.subtle.encrypt
                        name: "RSA-OAEP"
                    , keypair.publicKey
                    , btoabuffer.decode btoa form.password

                .then (data) ->
                    form.authtoken = btoabuffer.encode data
                    return form

                Bacon.fromPromise keys
            else
                Bacon.once form


    ###
    Assign reactive actions
    ###
    onRender: ->
        @initForm()
        @initErrors()

        # Step valve
        @onStep = @model.get('step').sampledBy(@form).map (step) ->
            step is 'preset'
        .toProperty()

        # Set the next button enable state when all required fields are filled
        @model.nextEnabled.plug @required.changes()

        # We plug it to the signup stream and to the next button busy state (e.g
        # the busy state is enable when the form is submitted)
        @model.signup.plug @handleSubmit()
        @model.nextBusy.plug @handleSubmit().map true
