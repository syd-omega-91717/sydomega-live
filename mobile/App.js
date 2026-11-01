import React, { useRef, useState, useCallback } from 'react';
import { BackHandler, Linking, Platform, View, ActivityIndicator, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { hostOf, isInternal, isOpenableExternally } from './navigation';

// The app is a shell around the live site. All auth, approval and data access
// stay in the web app (Supabase RLS is the boundary); nothing is stored here.
const SITE = (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.siteUrl) || 'https://sydomega.pages.dev';
const HOST = hostOf(SITE); // throws at startup if siteUrl is not https
const BG = '#0a0a0f';

export default function App() {
  const ref = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && ref.current) { ref.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  // Keep navigation on the site's own https origin; hand only web/mail/tel links
  // to the OS and drop everything else (data:, javascript:, intent:, file:). See navigation.js.
  const onShouldStart = useCallback((req) => {
    if (isInternal(req.url, HOST)) return true;
    if (isOpenableExternally(req.url)) Linking.openURL(req.url).catch(() => {});
    return false;
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.msg}>Can't reach SYD OMEGA right now.</Text>
          <Pressable style={styles.btn} onPress={() => { setFailed(false); ref.current && ref.current.reload(); }}>
            <Text style={styles.btnText}>RETRY</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={ref}
          source={{ uri: SITE }}
          style={styles.web}
          onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
          onShouldStartLoadWithRequest={onShouldStart}
          onError={() => setFailed(true)}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) setFailed(true); }}
          startInLoadingState
          renderLoading={() => <View style={styles.center}><ActivityIndicator color="#C9A84C" /></View>}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          domStorageEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 44 },
  web: { flex: 1, backgroundColor: BG },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  msg: { color: '#d8d5cb', marginBottom: 16 },
  btn: { borderColor: '#C9A84C', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  btnText: { color: '#C9A84C', letterSpacing: 3 },
});
