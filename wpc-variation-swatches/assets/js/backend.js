'use strict';

(function($) {
  $(function() {
    $('.wpcvs_color').wpColorPicker();

    // Only show the "remove image" button when needed
    if ('' === $('#wpcvs_image').val()) {
      $('#wpcvs_remove_image').hide();
    }

    $('.wpcvs_groups_selector').selectWoo({
      tags: true, multiple: true,
    });
  });

  $(document).on('click touch', '#wpcvs_upload_image', function(e) {
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
    wpcvs_media.on('select', function() {
      var attachment = wpcvs_media.state().
          get('selection').
          first().
          toJSON();

      $('#wpcvs_image').val(attachment.id);
      $('#wpcvs_image_thumbnail').
          find('img').
          attr('src', attachment.sizes.thumbnail
              ? attachment.sizes.thumbnail.url
              : attachment.url);
      $('#wpcvs_remove_image').show();
    });
    // Finally, open the modal.
    wpcvs_media.open();
  });

  $(document).on('click touch', '#wpcvs_remove_image', function() {
    $('#wpcvs_image_thumbnail').
        find('img').
        attr('src', wpcvs_vars.placeholder_img);
    $('#wpcvs_image').val('');
    $('#wpcvs_remove_image').hide();
    return false;
  });
})(jQuery);