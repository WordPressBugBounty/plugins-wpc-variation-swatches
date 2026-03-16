<?php
defined( 'ABSPATH' ) || exit;

register_activation_hook( defined( 'WPCVS_LITE' ) ? WPCVS_LITE : WPCVS_FILE, 'wpcvs_activate' );
register_deactivation_hook( defined( 'WPCVS_LITE' ) ? WPCVS_LITE : WPCVS_FILE, 'wpcvs_deactivate' );
add_action( 'admin_init', 'wpcvs_check_version' );

function wpcvs_check_version() {
	if ( ! empty( get_option( 'wpcvs_version' ) ) && ( get_option( 'wpcvs_version' ) < WPCVS_VERSION ) ) {
		wpc_log( 'wpcvs', 'upgraded' );
		update_option( 'wpcvs_version', WPCVS_VERSION, false );
	}
}

function wpcvs_activate() {
	wpc_log( 'wpcvs', 'installed' );
	update_option( 'wpcvs_version', WPCVS_VERSION, false );
}

function wpcvs_deactivate() {
	wpc_log( 'wpcvs', 'deactivated' );
}

if ( ! function_exists( 'wpc_log' ) ) {
	function wpc_log( $prefix, $action ) {
		$logs = get_option( 'wpc_logs', [] );
		$user = wp_get_current_user();

		if ( ! isset( $logs[ $prefix ] ) ) {
			$logs[ $prefix ] = [];
		}

		$logs[ $prefix ][] = [
			'time'   => current_time( 'mysql' ),
			'user'   => $user->display_name . ' (ID: ' . $user->ID . ')',
			'action' => $action
		];

		update_option( 'wpc_logs', $logs, false );
	}
}