import { HiOutlineEnvelope, HiOutlineCodeBracket } from 'react-icons/hi2';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-credits">
          <HiOutlineCodeBracket className="footer-icon" />
          <span>Created by <span className="footer-author">Girish Jha</span></span>
        </div>
        <div className="footer-contact">
          <HiOutlineEnvelope className="footer-icon" />
          <a href="mailto:giriskumar18983@gmail.com">giriskumar18983@gmail.com</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
