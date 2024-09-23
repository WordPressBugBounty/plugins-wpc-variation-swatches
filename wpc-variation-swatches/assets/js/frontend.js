'use strict';

window.wpcvs = {};

(function(wpcvs, $) {
  wpcvs = wpcvs || {};

  $.extend(wpcvs, {
    Swatches: {
      init: function() {
        var $term = $('.wpcvs-term');

        // load default value
        $term.each(function() {
          var $this = $(this), term = $this.attr('data-term'),
              label = $this.attr('data-label'),
              attr = $this.closest('.wpcvs-terms').attr('data-attribute'),
              $select = $this.closest('.wpcvs-terms').
                  parent().find('select#' + attr);

          if (!$select.length) {
            $select = $this.closest('.wpcvs-terms').parent().
                find('select[data-attribute_name="attribute_' + attr + '"]');
          }

          if (!$select.length) {
            $select = $this.closest('.wpcvs-terms').parent().
                find('select[name="attribute_' + attr + '"]');
          }

          if ($select.length) {
            if ($select.val() !== '' && term === $select.val()) {
              $(this).addClass('wpcvs-selected').find('input[type="radio"]').
                  prop('checked', true);

              // stacked
              $(this).
                  closest('.wpcvs-attribute').
                  find('.wpcvs-attribute-selected').
                  html(label);
            }
          }
        });

        $term.unbind('click touch').on('click touch', function(e) {
          if ($(this).hasClass('wpcvs-disabled')) {
            return false;
          }

          var $this = $(this), title = $this.attr('title'),
              term = $this.attr('data-term'), label = $this.attr('data-label'),
              attr = $this.closest('.wpcvs-terms').attr('data-attribute'),
              $select = $this.closest('.wpcvs-terms').
                  parent().find('select#' + attr);

          if (!$select.length) {
            $select = $this.closest('.wpcvs-terms').parent().
                find('select[data-attribute_name="attribute_' + attr + '"]');
          }

          if (!$select.length) {
            $select = $this.closest('.wpcvs-terms').parent().
                find('select[name="attribute_' + attr + '"]');
          }

          if (!$select.length) {
            return false;
          }

          if (!$this.hasClass('wpcvs-selected')) {
            $select.val(term).trigger('change');

            $this.closest('.wpcvs-terms').
                find('.wpcvs-selected').
                removeClass('wpcvs-selected').
                find('input[type="radio"]').
                prop('checked', false);

            $this.addClass('wpcvs-selected').
                find('input[type="radio"]').
                prop('checked', true);

            // stacked
            $this.closest('.wpcvs-attribute').
                find('.wpcvs-attribute-selected').
                html(label);

            $(document).trigger('wpcvs_select', [attr, term, title]);
            $(document).trigger('wpcvs_selected', [attr, term, title]); // deprecated
          } else {
            if (wpcvs_vars.second_click === 'yes') {
              // second click
              $select.val('').trigger('change');

              $this.closest('.wpcvs-terms').
                  find('.wpcvs-selected').
                  removeClass('wpcvs-selected').
                  find('input[type="radio"]').
                  prop('checked', false);

              // stacked
              $this.closest('.wpcvs-attribute').
                  find('.wpcvs-attribute-selected').
                  html('');

              $(document).trigger('wpcvs_deselect', [attr, term, title]);
              $(document).trigger('wpcvs_reset', [attr, term, title]); // deprecated
            }
          }

          e.preventDefault();
        });

        // tooltip
        if (wpcvs_vars.tooltip_library === 'tippy') {
          tippy('.wpcvs-tippy-tooltip', {
            allowHTML: true, interactive: true,
          });
        }

        $term.closest('.variations_form').addClass('wpcvs-form-initialized');
        $term.closest('.variations').addClass('wpcvs-initialized');
        $(document).trigger('wpcvs_init');
      },
    },
  });
}).apply(this, [window.wpcvs, jQuery]);

(function(wpcvs, $) {
  $(document).on('wc_variation_form', function() {
    if (typeof wpcvs.Swatches !== 'undefined') {
      wpcvs.Swatches.init();
    }

    $(document).trigger('wpcvs_variation_form');
  });

  $(document).on('woocommerce_update_variation_values', function(e) {
    $(e['target']).find('select').each(function() {
      var $this = $(this);
      var $terms = $this.parent().parent().find('.wpcvs-terms');

      $terms.find('.wpcvs-term:not(.extra)').
          removeClass('wpcvs-enabled').
          addClass('wpcvs-disabled');

      $this.find('option.enabled').each(function() {
        var val = $(this).val();

        $terms.find('.wpcvs-term[data-term="' + val + '"]').
            removeClass('wpcvs-disabled').
            addClass('wpcvs-enabled');
      });
    });

    $(document).trigger('wpcvs_update_variation_values', [e]);
  });

  $(document).on('found_variation', function(e, t) {
    var $target = $(e['target']);

    if ($target.closest('.wpcvs_archive').length &&
        $target.closest(wpcvs_vars.archive_product).length) {
      // archive
      var $product = $target.closest(wpcvs_vars.archive_product);
      var $image = $product.find(wpcvs_vars.archive_image);
      var $name = $product.find(wpcvs_vars.archive_name);
      var $price = $product.find(wpcvs_vars.archive_price);
      var $atc = $product.find(wpcvs_vars.archive_atc);
      var $atc_text = $product.find(wpcvs_vars.archive_atc_text);

      if ($atc.length) {
        $atc.addClass('wpcvs_add_to_cart').
            attr('data-variation_id', t['variation_id']).
            attr('data-product_sku', t['sku']);

        if (!t['is_purchasable'] || !t['is_in_stock']) {
          $atc.addClass('disabled wc-variation-is-unavailable');
        } else {
          $atc.removeClass('disabled wc-variation-is-unavailable');
        }

        $atc.removeClass('added error loading');
      }

      $product.find('a.added_to_cart').remove();

      if ($atc_text.length) {
        // add to cart button text
        $atc_text.html(wpcvs_vars.add_to_cart);
      }

      // WPC External Variations
      $product.find('.wpcev-btn').remove();

      if ((t.wpcev_btn !== undefined) && (t.wpcev_btn !== '')) {
        $(wpcvs_decode_entities(t.wpcev_btn)).
            removeClass('single_add_to_cart_button').
            addClass('add_to_cart_button').
            insertBefore($atc);
      }

      if ($image.length) {
        // product image
        if ($image.data('o_src') == undefined) {
          $image.data('o_src', $image.attr('src'));
        }

        if ($image.data('o_srcset') == undefined) {
          $image.data('o_srcset', $image.attr('srcset'));
        }

        if ($image.data('o_sizes') == undefined) {
          $image.data('o_sizes', $image.attr('sizes'));
        }

        if (t['image']['wpcvs_src'] != undefined && t['image']['wpcvs_src'] !=
            '') {
          $image.attr('src', t['image']['wpcvs_src']);
        } else {
          $image.attr('src', $image.data('o_src'));
        }

        if (t['image']['wpcvs_srcset'] != undefined &&
            t['image']['wpcvs_srcset'] != '') {
          $image.attr('srcset', t['image']['wpcvs_srcset']);
        } else {
          $image.attr('srcset', $image.data('o_srcset'));
        }

        if (t['image']['wpcvs_sizes'] != undefined &&
            t['image']['wpcvs_sizes'] != '') {
          $image.attr('sizes', t['image']['wpcvs_sizes']);
        } else {
          $image.attr('sizes', $image.data('o_sizes'));
        }
      }

      if ($price.length) {
        // product price
        if ($price.data('o_price') == undefined) {
          $price.data('o_price', $price.html());
        }

        if ((t['price_html'] != undefined) && (t['price_html'] != '')) {
          $price.html(t['price_html']);
        } else {
          $price.html($price.data('o_price'));
        }
      }

      if ($name.length) {
        // product name
        if ($name.data('o_name') == undefined) {
          $name.data('o_name', $name.html());
        }

        if ((t['wpcvs_name'] != undefined) && (t['wpcvs_name'] != '')) {
          $name.html(t['wpcvs_name']);
        } else {
          $name.html($name.data('o_name'));
        }
      }

      $(document).trigger('wpcvs_archive_found_variation', [e, t]);
    } else {
      // single
      if (wpcvs_vars.single_replacement === 'enable') {
        var $product = $target.closest(wpcvs_vars.single_product);
        var $name = $product.find(wpcvs_vars.single_name);
        var $price = $product.find(wpcvs_vars.single_price);
        var $desc = $product.find(wpcvs_vars.single_desc);

        if ($name.length) {
          if ($name.data('o_name') == undefined) {
            $name.data('o_name', $name.html());
          }

          if ((t['wpcvs_name'] != undefined) && (t['wpcvs_name'] != '')) {
            $name.html(t['wpcvs_name']);
          } else {
            $name.html($name.data('o_name'));
          }
        }

        if ($price.length) {
          if ($price.data('o_price') == undefined) {
            $price.data('o_price', $price.html());
          }

          if ((t['price_html'] != undefined) && (t['price_html'] != '')) {
            $price.html(t['price_html']);
          } else {
            $price.html($price.data('o_price'));
          }
        }

        if ($desc.length) {
          if ($desc.data('o_desc') == undefined) {
            $desc.data('o_desc', $desc.html());
          }

          if ((t.wpcvs_desc != undefined) && (t.wpcvs_desc != '')) {
            $desc.addClass('wpcvs-desc').html(t.wpcvs_desc);
          } else {
            $desc.removeClass('wpcvs-desc').html($desc.data('o_desc'));
          }
        }

        $(document).trigger('wpcvs_single_found_variation', [e, t]);
      }
    }

    $(document).trigger('wpcvs_found_variation', [e, t]);
  });

  $(document).on('reset_data', function(e) {
    var $target = $(e['target']);

    $target.find('.wpcvs-selected').
        removeClass('wpcvs-selected').
        find('input[type="radio"]').
        prop('checked', false);

    // stacked
    $target.find('.wpcvs-attribute-selected').html('');

    $target.find('select').each(function() {
      var attr = $(this).attr('id');
      var title = $(this).find('option:selected').text();
      var term = $(this).val();

      if (term != '') {
        $(this).parent().parent().
            find('.wpcvs-term[data-term="' + term + '"]').
            addClass('wpcvs-selected').find('input[type="radio"]').
            prop('checked', true);

        // stacked
        $(this).closest('.wpcvs-attribute').
            find('.wpcvs-attribute-selected').
            html(title);

        $(document).trigger('wpcvs_select', [attr, term, title]);
        $(document).trigger('wpcvs_selected', [attr, term, title]); // deprecated
      }
    });

    if ($target.closest('.wpcvs_archive').length &&
        $target.closest(wpcvs_vars.archive_product).length) {
      // archive
      var $product = $target.closest(wpcvs_vars.archive_product);
      var $image = $product.find(wpcvs_vars.archive_image);
      var $name = $product.find(wpcvs_vars.archive_name);
      var $price = $product.find(wpcvs_vars.archive_price);
      var $atc = $product.find(wpcvs_vars.archive_atc);
      var $atc_text = $product.find(wpcvs_vars.archive_atc_text);

      if ($atc.length) {
        $atc.removeClass(
            'wpcvs_add_to_cart disabled wc-variation-is-unavailable').
            attr('data-variation_id', '0').
            attr('data-product_sku', '');

        $atc.removeClass('added error loading');
      }

      $product.find('a.added_to_cart').remove();

      if ($atc_text.length) {
        // add to cart button text
        $atc_text.html(wpcvs_vars.select_options);
      }

      // WPC External Variations
      $product.find('.wpcev-btn').remove();

      if ($image.length) {
        // product image
        $image.attr('src', $image.data('o_src'));
        $image.attr('srcset', $image.data('o_srcset'));
        $image.attr('sizes', $image.data('o_sizes'));
      }

      if ($name.length) {
        // product name
        $name.html($name.data('o_name'));
      }

      if ($price.length) {
        // product price
        $price.html($price.data('o_price'));
      }

      $(document).trigger('wpcvs_archive_reset_data', [e]);
    } else {
      // single
      if (wpcvs_vars.single_replacement === 'enable') {
        var $product = $target.closest(wpcvs_vars.single_product);
        var $name = $product.find(wpcvs_vars.single_name);
        var $price = $product.find(wpcvs_vars.single_price);
        var $desc = $product.find(wpcvs_vars.single_desc);

        if ($name.length) {
          $name.html($name.data('o_name'));
        }

        if ($price.length) {
          $price.html($price.data('o_price'));
        }

        if ($desc.length) {
          $desc.removeClass('wpcvs-desc').html($desc.data('o_desc'));
        }

        $(document).trigger('wpcvs_single_reset_data', [e]);
      }
    }

    $(document).trigger('wpcvs_reset_data', [e]);
  });

  $(document).on('click touch', '.wpcvs_add_to_cart', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var $product = $btn.closest(wpcvs_vars.archive_product);
    var attributes = {};

    $btn.removeClass('added error').addClass('loading');

    if ($product.length) {
      $product.find('a.added_to_cart').remove();

      $product.find('[name^="attribute"]').each(function() {
        attributes[$(this).attr('data-attribute_name')] = $(this).val();
      });

      var data = {
        action: 'wpcvs_add_to_cart',
        nonce: wpcvs_vars.nonce,
        product_id: $btn.attr('data-product_id'),
        variation_id: $btn.attr('data-variation_id'),
        quantity: $btn.attr('data-quantity'),
        attributes: JSON.stringify(attributes),
      };

      $.post(wpcvs_vars.wc_ajax_url.toString().
              replace('%%endpoint%%', 'wpcvs_add_to_cart'), data,
          function(response) {
            if (response) {
              if (response.error && response.product_url) {
                window.location = response.product_url;
                return;
              }

              if ((typeof wc_add_to_cart_params !== 'undefined') &&
                  (wc_add_to_cart_params.cart_redirect_after_add === 'yes')) {
                window.location = wc_add_to_cart_params.cart_url;
                return;
              }

              $btn.removeClass('loading').
                  addClass('added').
                  after(wpcvs_vars.view_cart);
              $(document.body).
                  trigger('added_to_cart',
                      [response.fragments, response.cart_hash, $btn]).
                  trigger('wc_fragment_refresh');
            } else {
              $btn.removeClass('loading').addClass('error');
            }
          });

      $(document).trigger('wpcvs_add_to_cart', [$btn, $product, attributes]);
    }
  });

  $(document).
      on('change', '.variations_form select[name^="attribute_"]', function() {
        // link
        var $this = $(this);

        if ($this.closest('.wpcvs_archive').length ||
            $this.closest('.wpcvs-initialized').length ||
            $this.closest('.wpcvs-form').length) {
          var $form = $this.closest('.variations_form');
          var link = new URL($form.attr('action'));
          var search = new URLSearchParams(link.search);
          var new_link = '';

          $form.find('select[name^="attribute_"]').each(function() {
            var $_this = $(this), attr = $_this.data('attribute_name'),
                term = $_this.find(':selected').val();

            if (term !== undefined && term !== '') {
              search.set(attr, term);
            } else {
              search.delete(attr);
            }
          });

          if (search.toString() !== '') {
            new_link = link + '?' + search.toString();
          } else {
            new_link = link;
          }

          if ($this.closest('form.variations_form').length) {
            // change url for single
            if (wpcvs_vars.single_change_url === 'yes') {
              window.history.replaceState(null, null, new_link);
            }
          } else if ($this.closest('.wpcvs_archive.wpcvs_link').length) {
            // redirect
            window.location = new_link;
            return false;
          } else if ($this.closest('.wpcvs_archive').length) {
            // change url for archive
            if (wpcvs_vars.archive_change_url === 'yes') {
              $this.closest(wpcvs_vars.archive_product).
                  find(wpcvs_vars.archive_link).attr('href', new_link);
            }
          }
        }
      });
}).apply(this, [window.wpcvs, jQuery]);

function wpcvs_decode_entities(encodedString) {
  var textArea = document.createElement('textarea');
  textArea.innerHTML = encodedString;

  return textArea.value;
}
