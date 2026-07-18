proc foo(cb: proc()) = cb()
proc main() =
  try: foo proc() =
    echo "inside"
  except IOError:
    discard
main()
