/* eslint-disable security/detect-object-injection */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import {
  CheckCircleOutlineRounded,
  FileCopyOutlined,
  People,
  Person,
  PortableWifiOff,
  WifiTethering,
} from "@material-ui/icons";

import { observer } from "mobx-react-lite";
import RoomService from "../services/RoomService";
import SendIllustration from "../assets/icons/plane.png";

import { FileDropper, FileReceiver } from "../components/Sharing/FileDropper";
import { LoadingState } from "../components/Sharing/LoadingState";
import {
  LOADING_STATE_MESSAGES,
  LOADING_STATES,
  ERROR_STATES,
  ERROR_STATE_MESSAGES,
} from "../constants/Sharing";

import { ErrorState } from "../components/Sharing/ErrorState";
import Button from "../components/Button";
import Text from "../components/Text";
import FileStore from "../store/FileStore";
import { WebRTCConnectionStatus } from "../types/WebRTC";

const Wrapper = styled.div`
  display: flex;
  height: 90%;
  @media screen and (min-width: 960px) {
    align-items: center;
    justify-content: center;
  }
`;

const Container = styled.div`
  height: fit-content;
  width: 1024px;
  padding: 32px;
  margin-top: 32px;
  border: 1px solid #1f2937;
  background-color: #1f2937;
  border-radius: 8px;
`;

const ActionAndContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 500px;
  @media screen and (min-width: 960px) {
    flex-direction: row;
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 0 48px 0;
  @media screen and (min-width: 960px) {
    margin: 0 48px 0 0;
    width: 60%;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media screen and (min-width: 960px) {
    width: 50%;
  }
`;

const RoomLinkContainer = styled.div`
  margin-bottom: 12px;
`;

const RoomLinkActionContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const RoomLink = styled.input`
  padding: 8px 12px;
  border-radius: 8px;
  width: 100%;
  margin-right: 8px;
  background: transparent;
  color: white;
  border: 1px solid #9ca3af;
  font-size: 14px;
`;

const CopyLink = styled.div`
  padding: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 8px;
  &:hover {
    background-color: #5ea1b8;
    transition: 0.3s;
  }
  &:active {
    transform: scale(0.8);
  }
`;

const Heading = styled.div``;

const IllustrationWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Illustration = styled.img<{ enlarge: boolean }>`
  margin-top: 32px;
  height: ${({ enlarge }) => {
    return enlarge ? "250px" : "170px";
  }};
  max-width: 100%;
`;

const CreateNewRoomWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CreateNewRoomButtonWrapper = styled.div`
  margin-top: 24px;
`;

const StatusesWrapper = styled.div`
  margin-bottom: 12px;
`;

const StatusesActionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #9ca3af;
  border-radius: 8px;
  margin-top: 4px;
`;

const WebRTCStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  span {
    margin-right: 12px;
  }
`;

const PeerStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  span {
    margin-right: 12px;
  }
`;

const Sharing = (): React.ReactElement => {
  const [isRoomJoinedOrCreated, setIsRoomJoined] = useState(false);
  const [currentLoadingState, setLoadingState] = useState("");
  const [currentErrorState, setErrorState] = useState("");
  const [isRoomLinkCopied, setIsRoomLinkCopied] = useState(false);

  /**
   * Function to handle the joining of a room
   * The room is used to transfer signalling information for
   * webRTC connection between peers
   *
   * @param roomSlug - Room to connect
   */
  const handleRoomConnect = (roomSlug: string) => {
    RoomService.joinRoom(roomSlug);
    setLoadingState("");
    setIsRoomJoined(true);
  };

  /**
   * Function to handle creation of a room
   * The room is used to transfer signalling information for
   * webRTC connection between peers
   */
  const handleCreateRoom = async () => {
    setLoadingState(LOADING_STATES.create);

    try {
      const roomSlug = await RoomService.createRoom();

      window.history.pushState({}, "room-page", `/room/${roomSlug}`);

      RoomService.joinRoom(roomSlug);
      setErrorState("");
      setIsRoomJoined(true);
    } catch (error) {
      setErrorState(ERROR_STATES.create);
      // eslint-disable-next-line no-console
      console.log(
        "Sharing~handleCreateRoom: Error occurred while creating new room",
        "\nReason: ",
        error
      );
    } finally {
      setLoadingState("");
    }
  };

  /**
   * Function to handle and return various state like loading, error and normal
   *
   * @returns React Element
   */
  const getActionWrapperContent = () => {
    if (currentLoadingState) {
      return (
        <LoadingState content={LOADING_STATE_MESSAGES[currentLoadingState]} />
      );
    }

    if (currentErrorState) {
      return (
        <ErrorState
          handleRetry={handleRoomConnect}
          handleCreateNewRoom={handleCreateRoom}
          roomSlug={RoomService.getCurrentRoomSlug()}
          content={ERROR_STATE_MESSAGES[currentErrorState]}
        />
      );
    }

    if (!isRoomJoinedOrCreated) {
      return (
        <CreateNewRoomWrapper>
          <Text
            fontSize="20px"
            content="Create a room first to start sharing"
          />
          <CreateNewRoomButtonWrapper>
            <Button onClick={handleCreateRoom} width="fit-content">
              Create new room
            </Button>
          </CreateNewRoomButtonWrapper>
        </CreateNewRoomWrapper>
      );
    }

    if (Object.keys(FileStore.filesReceiveProgress).length) {
      return <FileReceiver />;
    }

    return <FileDropper />;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);

    setIsRoomLinkCopied(true);

    setTimeout(() => {
      setIsRoomLinkCopied(false);
    }, 3000);
  };

  /**
   * This checks if user want to connect to a pre-existing sharing room
   */
  useEffect(() => {
    const roomSlug = RoomService.getCurrentRoomSlug();

    if (roomSlug) {
      setLoadingState(LOADING_STATES.join);
      handleRoomConnect(roomSlug);
    }
  }, []);

  const IconStyles = { fontSize: "18px", color: "white" };

  return (
    <Wrapper>
      <Container>
        <ActionAndContentWrapper>
          <ActionWrapper>{getActionWrapperContent()}</ActionWrapper>
          <Content>
            {isRoomJoinedOrCreated && (
              <>
                <RoomLinkContainer>
                  <Text
                    content="Copy and share this link with your friend"
                    fontSize="14px"
                    fontWeight="600"
                  />
                  <RoomLinkActionContainer>
                    <RoomLink value={window.location.href} readOnly />
                    <CopyLink onClick={handleCopyLink}>
                      {isRoomLinkCopied ? (
                        <CheckCircleOutlineRounded style={IconStyles} />
                      ) : (
                        <FileCopyOutlined style={IconStyles} />
                      )}
                    </CopyLink>
                  </RoomLinkActionContainer>
                </RoomLinkContainer>

                <StatusesWrapper>
                  <Text
                    content="Connection Statuses"
                    fontSize="14px"
                    fontWeight="600"
                  />

                  <StatusesActionWrapper>
                    <WebRTCStatusWrapper>
                      <Text
                        content="WebRTC Connection"
                        fontSize="12px"
                        fontWeight="800"
                      />
                      {FileStore.webRTCConnectionStatus ===
                      WebRTCConnectionStatus.CONNECTED ? (
                        <WifiTethering style={{ color: "#81c784" }} />
                      ) : (
                        <PortableWifiOff style={{ color: "#ef4444" }} />
                      )}
                    </WebRTCStatusWrapper>
                    <PeerStatusWrapper>
                      <Text
                        content="Peer Connection"
                        fontSize="12px"
                        fontWeight="800"
                      />
                      {FileStore.peerConnectionStatus ? (
                        <People style={{ color: "#81c784" }} />
                      ) : (
                        <Person style={{ color: "#ef4444" }} />
                      )}
                    </PeerStatusWrapper>
                  </StatusesActionWrapper>
                </StatusesWrapper>
              </>
            )}

            <Heading>
              <Text
                content="Simple P2P file sharing"
                fontSize="32px"
                fontWeight="800"
              />
            </Heading>
            <Text
              content="Share files with your friends and colleagues with zero hassle"
              lineHeight="24px"
              color="#9ca3af"
            />
            <IllustrationWrapper>
              {" "}
              <Illustration
                src={SendIllustration}
                enlarge={!isRoomJoinedOrCreated}
              />
            </IllustrationWrapper>
          </Content>
        </ActionAndContentWrapper>
      </Container>
    </Wrapper>
  );
};

export default observer(Sharing);
