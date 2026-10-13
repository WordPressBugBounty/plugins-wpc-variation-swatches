'use strict';

(function ($) {
    $(function () {
        $('.wpcvs_color').wpColorPicker();

        // Only show the "remove image" button when needed
        if ('' === $('#wpcvs_image').val()) {
            $('#wpcvs_remove_image').hide();
        }

        $('.wpcvs_groups_selector').selectWoo({
            tags: true, multiple: true,
        });
    });

    $(document).on('click touch', '#wpcvs_upload_image', function (e) {
        // Uploading files
        var wpcvs_media;

        e.preventDefault();
        // If the media frame already exists, reopen it.
        if (wpcvs_media) {
            wpcvs_media.open();
            return;
        }
        // Create the media frame.
        wpcvs_media = wp.media.frames.downloadable_file = wp.media({
            title: 'Choose an image', button: {
                text: 'Use image',
            }, multiple: false,
        });
        // When an image is selected, run a callback.
        wpcvs_media.on('select', function () {
            var attachment = wpcvs_media.state().get('selection').first().toJSON();

            $('#wpcvs_image').val(attachment.id);
            $('#wpcvs_image_thumbnail').find('img').attr('src', attachment.sizes.thumbnail
                ? attachment.sizes.thumbnail.url
                : attachment.url);
            $('#wpcvs_remove_image').show();
        });
        // Finally, open the modal.
        wpcvs_media.open();
    });

    $(document).on('click touch', '#wpcvs_remove_image', function () {
        $('#wpcvs_image_thumbnail').find('img').attr('src', wpcvs_vars.placeholder_img);
        $('#wpcvs_image').val('');
        $('#wpcvs_remove_image').hide();
        return false;
    });

    // ------------------------------------------------------------------
    // Inline edit of term value (color / image) in the terms list table
    // ------------------------------------------------------------------
    var $modal = null;
    var $currentValue = null;
    var valueMedia = null;
    var isSaving = false;

    // Paint color swatches from data-color (avoids inline styles in markup)
    function paintColorSwatches() {
        $('.wpcvs-swatch--color[data-color]').each(function () {
            $(this).css('background-color', $(this).attr('data-color') || '');
        });
    }

    function showModalError(message) {
        $modal.find('#wpcvs-modal-error').text(message).prop('hidden', !message);
    }

    function openValueModal($link) {
        var type = $link.attr('data-type');
        var value = $link.attr('data-value') || '';
        var name = $link.attr('data-term-name') || '';

        $currentValue = $link;
        showModalError('');

        $modal.find('.wpcvs-modal-field').prop('hidden', true);
        $modal.find('.wpcvs-modal-field--' + type).prop('hidden', false);
        $modal.find('#wpcvs-modal-title').text(
            (wpcvs_vars.i18n['edit_' + type] || '').replace('%s', name));

        if (type === 'color') {
            // Rebuild the input each time so the color picker always starts clean
            var $wrap = $modal.find('#wpcvs-modal-color-wrap').empty();
            $('<input type="text" id="wpcvs-modal-color" class="wpcvs-modal-color"/>').val(value).appendTo($wrap).wpColorPicker();
        } else if (type === 'image') {
            $modal.find('#wpcvs-modal-image-id').val(value);
            $modal.find('#wpcvs-modal-image-preview').attr('src', $link.attr('data-src') || wpcvs_vars.placeholder_img);
        }

        $modal.prop('hidden', false);
        $('body').addClass('wpcvs-modal-open');
        $modal.find('#wpcvs-modal-save').trigger('focus');
    }

    function closeValueModal() {
        if (!$modal || isSaving) {
            return;
        }

        $modal.prop('hidden', true);
        $('body').removeClass('wpcvs-modal-open');
        $currentValue = null;
    }

    $(function () {
        $modal = $('#wpcvs-value-modal');

        paintColorSwatches();

        // New/updated rows inserted by core AJAX (add term, quick edit)
        $(document).ajaxComplete(paintColorSwatches);
    });

    $(document).on('click', '.wpcvs-term-value', function (e) {
        e.preventDefault();

        if ($modal && $modal.length) {
            openValueModal($(this));
        }
    });

    $(document).on('click', '#wpcvs-value-modal [data-wpcvs-close]', function (e) {
        e.preventDefault();
        closeValueModal();
    });

    $(document).on('keydown', function (e) {
        // Let the media modal handle Escape while it is open
        if (e.key === 'Escape' && $modal && !$modal.prop('hidden') && !$('.media-modal:visible').length) {
            closeValueModal();
        }
    });

    $(document).on('click', '#wpcvs-modal-upload-image', function (e) {
        e.preventDefault();

        if (!valueMedia) {
            valueMedia = wp.media({
                title: wpcvs_vars.i18n.choose_image,
                button: {text: wpcvs_vars.i18n.use_image},
                library: {type: 'image'},
                multiple: false,
            });

            valueMedia.on('select', function () {
                var attachment = valueMedia.state().get('selection').first().toJSON();
                var src = attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;

                $('#wpcvs-modal-image-id').val(attachment.id);
                $('#wpcvs-modal-image-preview').attr('src', src);
            });
        }

        valueMedia.open();
    });

    $(document).on('click', '#wpcvs-modal-remove-image', function (e) {
        e.preventDefault();
        $('#wpcvs-modal-image-id').val('');
        $('#wpcvs-modal-image-preview').attr('src', wpcvs_vars.placeholder_img);
    });

    $(document).on('click', '#wpcvs-modal-save', function (e) {
        e.preventDefault();

        if (isSaving || !$currentValue) {
            return;
        }

        var $button = $(this);
        var type = $currentValue.attr('data-type');
        var value = type === 'color' ? $('#wpcvs-modal-color').val() : $('#wpcvs-modal-image-id').val();

        isSaving = true;
        showModalError('');
        $button.prop('disabled', true).text(wpcvs_vars.i18n.saving);

        $.post(wpcvs_vars.ajax_url, {
            action: 'wpcvs_save_term_value',
            nonce: wpcvs_vars.nonce,
            term_id: $currentValue.attr('data-term-id'),
            value: value,
        }).done(function (response) {
            if (response && response.success) {
                var $updated = $(response.data.html);

                $currentValue.replaceWith($updated);
                isSaving = false;
                paintColorSwatches();
                closeValueModal();
            } else {
                showModalError(response && response.data && response.data.message ? response.data.message : wpcvs_vars.i18n.error);
            }
        }).fail(function () {
            showModalError(wpcvs_vars.i18n.error);
        }).always(function () {
            isSaving = false;
            $button.prop('disabled', false).text(wpcvs_vars.i18n.save);
        });
    });
})(jQuery);