import axios from 'axios';
import React, {useRef, useState, useEffect} from 'react';
import {SafeAreaView, StyleSheet, View, Text, Dimensions} from 'react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
} from 'react-native-agora';

const appId = 'd05d649ea90d4a8fb592835692ab524f';
const channelName = 'demo';
const token =
  '007eJxTYMhbydOyckXsyTcO8ZXPhf+p7dIxOpcpdeuX75o7LJ+VbJcrMKQYmKaYmVimJloapJgkWqQlmVoaWRibmlkaJSaZGpmk3T6qkdoQyMgQtPQQIyMDBIL4LAwFGaXJDAwAjxIgcA==';
const uid = 0;

const {height} = Dimensions.get('screen');

const App = () => {
  const agoraEngineRef = useRef<IRtcEngine>(); // Agora engine instance
  const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
  const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
  const [message, setMessage] = useState(''); // Message to the user
  const [userID, setUserID] = useState(
    Math.floor(new Date().getTime() / 1000).toString(),
  ); // Uid of the remote user
  const [rtcToken, setRtcToken] = useState('');
  const [startObject, setStartObject] = useState({
    resource_id: '',
    sid: '',
  });

  useEffect(() => {
    // Initialize Agora engine when the app starts
    setupVideoSDKEngine();
  });

  useEffect(() => {
    // axios
    //   .post('https://dev-api.sevenrone.online/api/v1/recordings/rtc_token', {
    //     params: {channel_name: channelName, user_id: userID},
    //   })
    //   .then(res => {
    //     console.log('rtcToken: ', res.data.rtc_token);
    //     setRtcToken(res?.data?.rtc_token);
    //   })
    //   .catch(err => {
    //     console.log(err);
    //   });
    axios
      .get('https://dev-api.sevenrone.online/api/v1/platforms?limit=10')
      .then(res => {
        console.log('rtcToken: ', res.data.records[0].token);
        setRtcToken(res.data.records[0].token);
      })
      .catch(err => {
        console.log(err);
      });
  }, [userID]);

  const setupVideoSDKEngine = async () => {
    try {
      // use the helper function to get permissions
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('onJoinChannelSuccess');
          showMessage('Successfully joined the channel ' + channelName);
          setIsJoined(true);
        },
        onUserJoined: (_connection, Uid) => {
          console.log('Uid: ', Uid);
          showMessage('Remote user joined with uid ' + Uid);
          setRemoteUid(Uid);
        },
        onUserOffline: (_connection, Uid) => {
          showMessage('Remote user left the channel. uid: ' + Uid);
          setRemoteUid(0);
        },
      });
      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraEngine.enableVideo();
    } catch (e) {
      console.log(e);
    }
  };

  const join = async () => {
    if (isJoined) {
      return;
    }
    try {
      agoraEngineRef.current?.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication,
      );

      agoraEngineRef.current?.startPreview();
      // agoraEngineRef.current?.joinChannelWithUserAccount(
      //   rtcToken,
      //   channelName,
      //   userID.toString(),
      // );
      agoraEngineRef.current?.joinChannel(
        rtcToken,
        channelName,
        parseInt(userID),
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        },
      );
      axios
        .post('https://dev-api.sevenrone.online/api/v1/recordings/start', {
          channel_name: channelName,
          user_id: userID,
          mode: 'mix',
          rtc_token: rtcToken,
        })
        .then(res => {
          console.log('setStartObject: ', res.data);
          setStartObject({...res?.data});
        })
        .catch(err => {
          console.log('err.message: ', err?.response?.message);
        });
    } catch (e) {
      console.log(e);
    }
  };

  const leave = () => {
    console.log({
      channel_name: channelName,
      user_id: userID,
      mode: 'mix',
      resource_id: startObject?.resource_id || '',
      sid: startObject?.sid,
    });
    try {
      agoraEngineRef.current?.leaveChannel();
      axios
        .post('https://dev-api.sevenrone.online/api/v1/recordings/stop', {
          channel_name: channelName,
          user_id: userID,
          mode: 'mix',
          resource_id: startObject?.resource_id || '',
          sid: startObject?.sid,
        })
        .then(res => {
          console.log('setStartObject: ', res.data);
          // setStartObject({...res?.data});
        })
        .catch(err => {
          console.log(err);
        });
      setRemoteUid(0);
      setIsJoined(false);
      showMessage('You left the channel');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      {remoteUid !== 0 && (
        <View style={styles.infoContent}>
          <Text style={styles.textInfo}>Local user uid: {userID}</Text>
          <Text style={styles.textInfo}>Remote user uid: {remoteUid}</Text>
        </View>
      )}
      <View style={styles.scroll}>
        <View style={styles.btnContainer}>
          <Text onPress={join} style={styles.button}>
            Join
          </Text>
          <Text onPress={leave} style={styles.button}>
            Leave
          </Text>
        </View>
        {isJoined ? (
          <React.Fragment key={0}>
            <RtcSurfaceView
              canvas={{uid: uid}}
              style={styles.videoViewMini}
              zOrderMediaOverlay
              zOrderOnTop
            />
          </React.Fragment>
        ) : (
          <Text style={styles.textCenter}>Join a channel</Text>
        )}
        {isJoined && remoteUid !== 0 ? (
          <React.Fragment key={remoteUid}>
            <RtcSurfaceView
              canvas={{uid: remoteUid}}
              style={styles.videoView}
            />
          </React.Fragment>
        ) : (
          <Text style={styles.textCenter}>
            Waiting for a remote user to join
          </Text>
        )}
        {remoteUid === 0 && !!message && (
          <Text style={[styles.info, styles.textCenter]}>{message}</Text>
        )}
      </View>
    </SafeAreaView>
  );

  function showMessage(msg: string) {
    setMessage(msg);
  }
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0055cc',
    margin: 5,
  },
  main: {flex: 1, alignItems: 'center'},
  scroll: {
    flex: 1,
    backgroundColor: '#ddeeff',
    width: '100%',
  },
  scrollContainer: {alignItems: 'center'},
  videoView: {flex: 1},
  videoViewMini: {
    width: 150,
    height: height / 4,
    top: 50,
    right: 10,
    position: 'absolute',
    zIndex: 10,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  head: {fontSize: 20},
  info: {backgroundColor: '#ffffe0', color: '#0000ff'},
  infoContent: {position: 'absolute', top: 100, zIndex: 9},
  textInfo: {
    fontWeight: 'bold',
    margin: 1,
  },
  textCenter: {
    textAlign: 'center',
  },
  input: {
    height: 40,
    width: '100%',
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

const getPermission = async () => {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
  }
};

export default App;
